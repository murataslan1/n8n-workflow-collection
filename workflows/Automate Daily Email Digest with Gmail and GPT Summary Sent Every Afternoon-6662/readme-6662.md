Automate Daily Email Digest with Gmail and GPT Summary Sent Every Afternoon

https://n8nworkflows.xyz/workflows/automate-daily-email-digest-with-gmail-and-gpt-summary-sent-every-afternoon-6662


# Automate Daily Email Digest with Gmail and GPT Summary Sent Every Afternoon

---

### 1. Workflow Overview

This workflow automates the process of generating and sending a daily email digest summarizing all emails received in the user's Gmail inbox during the current day. It runs automatically every day at 4:00 PM local time, fetches emails from midnight to the current time, summarizes their content using OpenAI’s GPT model, and emails the summary to a specified recipient.

**Target Use Cases:**  
- Users who want a concise summary of their daily incoming emails without reading every message individually.  
- Professionals seeking an automated afternoon digest to prioritize or review email topics and action points.  

**Logical Blocks:**  
- **1.1 Trigger Block:** Initiates the workflow daily at a fixed time.  
- **1.2 Date Calculation Block:** Computes timestamps defining the time window of "today."  
- **1.3 Email Retrieval Block:** Queries Gmail for emails received during the day.  
- **1.4 Email Content Aggregation Block:** Combines relevant fields (sender, subject, snippet) into a single text input.  
- **1.5 AI Summarization Block:** Uses OpenAI to generate a high-level summary of the combined email content.  
- **1.6 Email Sending Block:** Sends the AI-generated summary via Gmail to the configured recipient.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger Block

- **Overview:**  
  This block triggers the entire workflow automatically every day at 4:00 PM local server time.

- **Nodes Involved:**  
  - `Afternoon Trigger (4 PM)`

- **Node Details:**  

  **Afternoon Trigger (4 PM)**  
  - Type: Cron Trigger  
  - Role: Initiates workflow execution daily at a specified time.  
  - Configuration: Runs every day at 16:00 (4 PM), local timezone (based on n8n server).  
  - Input: None (trigger node).  
  - Output: Triggers the next node `Calculate Today's Dates`.  
  - Version-specific notes: None.  
  - Potential Failures: Misconfigured timezone may cause unexpected trigger times. Server downtime at trigger time results in missed runs.  
  - Sticky Note: Explains how to adjust the schedule by changing hour and minute fields.

#### 1.2 Date Calculation Block

- **Overview:**  
  Calculates the ISO timestamp for the start of the current day (midnight) and the current time when the workflow runs. These timestamps define the timeframe for fetching today's emails.

- **Nodes Involved:**  
  - `Calculate Today's Dates`

- **Node Details:**  

  **Calculate Today's Dates**  
  - Type: Function  
  - Role: Generates two date/time ISO strings: `minDate` (today at 00:00:00) and `nowDate` (current time).  
  - Configuration: Uses internal DateTime library to get current time and start of day; no external parameters needed.  
  - Expressions: None external; uses internal `DateTime.now()` and `.startOf('day')`.  
  - Input: Trigger from `Afternoon Trigger (4 PM)`.  
  - Output: JSON object with `minDate` and `nowDate` properties passed to `Get Today's Emails (Gmail)`.  
  - Version-specific notes: None.  
  - Potential Failures: Unlikely unless internal date/time library malfunctions.  
  - Sticky Note: Describes node function and outputs clearly.

#### 1.3 Email Retrieval Block

- **Overview:**  
  Fetches emails from the Gmail inbox received between midnight and the current time, limited to 20 emails by default.

- **Nodes Involved:**  
  - `Get Today's Emails (Gmail)`

- **Node Details:**  

  **Get Today's Emails (Gmail)**  
  - Type: Gmail node  
  - Role: Queries Gmail API for emails using search operators `after:` and `before:` with dates from previous node.  
  - Configuration:  
    - Query: `after:{{ $json.minDate }} before:{{ $json.nowDate }}`  
    - Max Results: 20 (adjustable for more emails but watch token limits).  
    - Email Type: Inbox  
    - Operation: Get all matching emails.  
  - Input: Receives `minDate` and `nowDate` from `Calculate Today's Dates`.  
  - Output: List of emails with full metadata and snippets.  
  - Credentials: Requires Gmail API OAuth2 credentials with read scope (`gmail.readonly` or higher).  
  - Version-specific notes: Uses Gmail API v2 node.  
  - Potential Failures:  
    - Authentication errors if credentials are invalid or expired.  
    - API quota limits exceeded.  
    - Network timeout or API errors.  
    - Query syntax errors if date fields malformed.  
  - Sticky Note: Details setup for credentials, query usage, and permissions needed.

#### 1.4 Email Content Aggregation Block

- **Overview:**  
  Combines sender, subject, and snippet from each fetched email into a readable text format to feed into the AI summarization.

- **Nodes Involved:**  
  - `Combine Email Content`

- **Node Details:**  

  **Combine Email Content**  
  - Type: Function  
  - Role: Iterates over fetched emails, extracting key details and concatenating them into a summary string.  
  - Configuration:  
    - If no emails, outputs "No new emails received today."  
    - Otherwise constructs a string with each email’s sender, subject, and snippet separated by lines and delimiters.  
  - Input: Email items from `Get Today's Emails (Gmail)`.  
  - Output: JSON object with `combinedEmails` string.  
  - Version-specific notes: None.  
  - Potential Failures:  
    - If email headers missing expected fields (e.g., no subject or from), fallback values are used.  
    - Empty input handled gracefully.  
  - Sticky Note: Explains purpose and that no manual configuration is needed.

#### 1.5 AI Summarization Block

- **Overview:**  
  Uses OpenAI’s GPT model to generate a concise, human-readable summary of the day’s emails based on the combined text.

- **Nodes Involved:**  
  - `AI: Summarize Emails`

- **Node Details:**  

  **AI: Summarize Emails**  
  - Type: OpenAI (Chat Completion)  
  - Role: Sends prompt including combined emails to GPT for summarization.  
  - Configuration:  
    - Model: `gpt-3.5-turbo` (default; can be changed to `gpt-4o` for enhanced summaries).  
    - Messages:  
      - System prompt instructs AI to summarize key topics and action items, group related emails, and handle empty input.  
      - User prompt includes `{{ $json.combinedEmails }}` dynamically injected from previous node.  
  - Input: Combined email text from `Combine Email Content`.  
  - Output: AI-generated summary as `choices[0].message.content`.  
  - Credentials: Requires OpenAI API key credential.  
  - Version-specific notes: Compatible with OpenAI node v1.  
  - Potential Failures:  
    - API key invalid or quota exceeded.  
    - Prompt formatting errors.  
    - Timeout or network issues.  
  - Sticky Note: Detailed setup instructions for credentials, model choice, and prompt usage.

#### 1.6 Email Sending Block

- **Overview:**  
  Sends the AI-generated summary as an email to the specified recipient, including the current date in the subject for easy identification.

- **Nodes Involved:**  
  - `Send Summary Email`

- **Node Details:**  

  **Send Summary Email**  
  - Type: Gmail node (Send Email)  
  - Role: Sends an email with the daily summary in the body.  
  - Configuration:  
    - From Email: Must be the authenticated Gmail account address.  
    - To Email: User’s actual recipient email (must replace placeholder).  
    - Subject: Includes current date formatted as full weekday, month, day, year (e.g., "Daily Email Summary: Monday, April 10, 2024").  
    - Text: Body includes greeting, AI summary, and footer note explaining automation.  
  - Input: AI summary from `AI: Summarize Emails`.  
  - Output: Sent email confirmation.  
  - Credentials: Same Gmail API OAuth2 credential as earlier node.  
  - Version-specific notes: Uses Gmail node v2 for sending.  
  - Potential Failures:  
    - Authentication errors.  
    - Invalid email addresses.  
    - API limits or network errors.  
  - Sticky Note: Emphasizes changing recipient email and testing.

---

### 3. Summary Table

| Node Name               | Node Type          | Functional Role                  | Input Node(s)          | Output Node(s)           | Sticky Note                                                                                          |
|-------------------------|--------------------|--------------------------------|------------------------|--------------------------|----------------------------------------------------------------------------------------------------|
| Afternoon Trigger (4 PM) | Cron Trigger       | Daily trigger at 4 PM           | None                   | Calculate Today's Dates   | Explains schedule and how to adjust hour/minute fields.                                            |
| Calculate Today's Dates  | Function           | Calculate today’s date range    | Afternoon Trigger (4 PM) | Get Today's Emails (Gmail) | Explains output fields `minDate` and `nowDate`.                                                    |
| Get Today's Emails (Gmail) | Gmail (Get All)   | Fetch emails received today     | Calculate Today's Dates | Combine Email Content     | Details Gmail credential setup, query, max results, and permission scopes needed.                  |
| Combine Email Content    | Function           | Aggregate email details         | Get Today's Emails (Gmail) | AI: Summarize Emails     | Describes formatting logic and handling of empty email sets.                                       |
| AI: Summarize Emails    | OpenAI Chat Completion | Generate AI summary             | Combine Email Content   | Send Summary Email        | Explains OpenAI credential, model choice, and summarization prompt.                                |
| Send Summary Email       | Gmail (Send Email) | Send summary email to recipient | AI: Summarize Emails   | None                     | Reminds to update recipient email and test sending functionality.                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add a **Cron** node named `Afternoon Trigger (4 PM)`.  
   - Set mode to `everyDay`.  
   - Set hour to `16` and minute to `0` (4 PM).  
   - No credentials needed. Connect this as the start node.

2. **Create Date Calculation Node:**  
   - Add a **Function** node named `Calculate Today's Dates`.  
   - Paste this JavaScript code:  
     ```javascript
     const DateTime = this.getNodeParameter('DateTime');
     const now = DateTime.now();
     const startOfDay = now.startOf('day');
     return [{ json: { minDate: startOfDay.toISO(), nowDate: now.toISO() } }];
     ```  
   - Connect output of `Afternoon Trigger (4 PM)` to this node.

3. **Create Email Retrieval Node:**  
   - Add a **Gmail** node named `Get Today's Emails (Gmail)`.  
   - Operation: `getAll`.  
   - Email Type: `inbox`.  
   - Query: `after:{{ $json.minDate }} before:{{ $json.nowDate }}`  
   - Max Results: Set to `20` (or adjust based on volume).  
   - Configure Gmail API credentials: Create or select OAuth2 credential with Gmail API read permissions (`gmail.readonly` or full).  
   - Connect output of `Calculate Today's Dates` to this node.

4. **Create Email Content Aggregation Node:**  
   - Add a **Function** node named `Combine Email Content`.  
   - Paste the following code:  
     ```javascript
     let emailContent = "";
     if (items.length === 0) {
       emailContent = "No new emails received today.";
     } else {
       emailContent = "Today's Emails Summary:\n\n";
       for (const item of items) {
         const email = item.json;
         const sender = email.payload.headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
         const subject = email.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject';
         const snippet = email.snippet || 'No snippet available.';
         emailContent += `From: ${sender}\nSubject: ${subject}\nSnippet: ${snippet}\n---\n`;
       }
     }
     return [{ json: { combinedEmails: emailContent } }];
     ```  
   - Connect output of `Get Today's Emails (Gmail)` to this node.

5. **Create AI Summarization Node:**  
   - Add an **OpenAI** node named `AI: Summarize Emails`.  
   - Credential: Select or create OpenAI API Key credential.  
   - Model: `gpt-3.5-turbo` (or `gpt-4o` if available and desired).  
   - Messages:  
     - System role:  
       `"You are an AI assistant specialized in summarizing daily email communications. Your task is to read the provided email subjects and snippets, identify the most important topics and action items, and create a concise, readable summary. Group related emails if possible. If there are no emails, state that clearly."`  
     - User role:  
       `"Summarize the following daily email content:\n\n{{ $json.combinedEmails }}"`  
   - Connect output of `Combine Email Content` to this node.

6. **Create Email Sending Node:**  
   - Add a **Gmail** node named `Send Summary Email`.  
   - Operation: Send email.  
   - From Email: Enter your authenticated Gmail address (must match Gmail OAuth2 credentials).  
   - To Email: Replace placeholder `YOUR_RECIPIENT_EMAIL@example.com` with your actual recipient email address.  
   - Subject: Use expression: `Daily Email Summary: {{ DateTime.now().toFormat('cccc, LLLL dd, yyyy') }}` for dynamic date.  
   - Text:  
     ```
     Hello!

     Here's your daily email summary from n8n for today:

     {{ $node["AI: Summarize Emails"].json.choices[0].message.content }}

     ---

     *This is an automated summary generated by n8n. Please log into your inbox for full details.*
     ```  
   - Credential: Use the same Gmail API credential as earlier.  
   - Connect output of `AI: Summarize Emails` to this node.

7. **Save and Activate Workflow:**  
   - Double-check all credentials are valid and tested.  
   - Save and activate the workflow.  
   - Optional: Manually trigger from `Afternoon Trigger (4 PM)` node to test immediate execution.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                            |
|-----------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| To change the daily execution time, adjust the hour and minute fields in the `Afternoon Trigger`.   | Cron node configuration explanation.                        |
| Ensure Gmail credentials have `https://www.googleapis.com/auth/gmail.readonly` or higher scopes.    | Gmail API OAuth2 scopes documentation.                      |
| OpenAI API usage may incur costs depending on model and usage limits; monitor your API quotas.       | https://platform.openai.com/docs/api-reference/authentication |
| You must replace all placeholder email addresses (`YOUR_RECIPIENT_EMAIL@example.com`) with real ones.| Prevents sending emails to invalid addresses or errors.    |
| If you receive many emails daily, increase `Max Results` in Gmail node but watch for AI token limits.| To avoid prompt truncation or incomplete summaries.         |
| The AI prompt groups related emails and identifies action items for better summary quality.          | Helps to focus summary on actionable content.              |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly accessible.

---