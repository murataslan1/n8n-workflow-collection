Analyze Weekly Notes with GPT-4 for Actionable Tasks & Summaries

https://n8nworkflows.xyz/workflows/analyze-weekly-notes-with-gpt-4-for-actionable-tasks---summaries-8119


# Analyze Weekly Notes with GPT-4 for Actionable Tasks & Summaries

### 1. Workflow Overview

This workflow automates the analysis of weekly notes extracted from a Google Document to generate actionable tasks, summaries, and a professional weekly summary email for the user Julian Reich. It targets knowledge workers who maintain dated notes and want to automate task extraction, summary generation, and task archival with minimal manual effort.

The workflow is logically divided into these blocks:

- **1.1 Scheduled Trigger & Document Retrieval:** Periodically fetches the latest notes from a Google Doc.
- **1.2 Weekly Notes Parsing & Filtering:** Extracts and filters notes entries from the last 7 days based on date stamps.
- **1.3 AI Task Extraction:** Uses GPT-4 to analyze the filtered notes and extract structured tasks, deadlines, insights, and priorities.
- **1.4 AI Email Summary Generation:** Creates a personalized HTML weekly summary email based on the AI-extracted data.
- **1.5 Archiving Tasks in Google Docs:** Updates the original Google Doc by appending the extracted tasks summary.
- **1.6 Notifications & Email Dispatch:** Sends a Telegram notification on completion and emails the weekly summary to the user.
- **1.7 Error Handling:** Monitors for errors and sends Telegram alerts if failures occur.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Document Retrieval

- **Overview:**  
  This block initiates the workflow every week at 23:00 by triggering the retrieval of the Google Document containing Julian’s notes.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get a document

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Initiates workflow weekly at 23:00  
    - Configuration: Trigger interval set to every 1 week at hour 23  
    - Input: None  
    - Output: Triggers “Get a document” node  
    - Edge cases: Misconfigured schedule or disabled workflow could prevent execution

  - **Get a document**  
    - Type: Google Docs  
    - Role: Fetches the content of the specified Google Document URL  
    - Configuration: Operation “get” with a fixed Google Docs URL  
    - Credentials: Google Docs OAuth2  
    - Input: Trigger from Schedule Trigger  
    - Output: JSON containing the document content passed to “Weekly Filter”  
    - Edge cases: OAuth token expiry, Google Docs permission errors, document not found

#### 2.2 Weekly Notes Parsing & Filtering

- **Overview:**  
  Parses the raw Google Doc text to identify dated entries from the past 7 days. Extracts and sorts these entries chronologically to prepare the text for AI analysis.

- **Nodes Involved:**  
  - Weekly Filter (Function Node)

- **Node Details:**

  - **Weekly Filter**  
    - Type: Function  
    - Role: Extracts dated entries matching the pattern “📅 DD.MM.YYYY, HH:MM” from document text, filters by last 7 days, sorts chronologically  
    - Configuration: Uses RegExp to find entries, parses German-formatted dates, calculates current week number  
    - Key expressions: Uses `$input.first().json.content` for document text, builds `weeklyText` string concatenated with separators for AI input  
    - Input: Document content from “Get a document”  
    - Output: JSON object with filtered entries, count, week number, date range, and combined text  
    - Edge cases: No recent entries found (empty list), malformed date formats, timezone issues affecting date filtering, RegExp mismatches

#### 2.3 AI Task Extraction

- **Overview:**  
  Sends the filtered weekly notes text to GPT-4 for structured extraction of tasks, deadlines, insights, priorities, and category distributions.

- **Nodes Involved:**  
  - AI Task Extractor

- **Node Details:**

  - **AI Task Extractor**  
    - Type: OpenAI (LangChain integration)  
    - Role: Uses GPT-4 chat model to generate structured summary and task extraction based on input text  
    - Configuration: Model “chatgpt-4o-latest”, prompt instructs AI to output tasks, deadlines, insights, priorities, and category stats in a strict format  
    - Key expressions: Dynamic prompt includes entry count, date range, and filtered text from “Weekly Filter” node  
    - Credentials: OpenAI API key  
    - Input: Filtered weekly text and metadata  
    - Output: AI-generated message with structured content for further processing  
    - Edge cases: API rate limits, timeout, malformed input, language understanding errors, output format deviations

#### 2.4 AI Email Summary Generation

- **Overview:**  
  Generates a professional, personalized weekly summary email in HTML format using GPT-4, incorporating the extracted tasks and insights.

- **Nodes Involved:**  
  - AI E-Mail Summary

- **Node Details:**

  - **AI E-Mail Summary**  
    - Type: OpenAI (LangChain integration)  
    - Role: Creates an HTML formatted email body summarizing the week, tasks, insights, and statistics  
    - Configuration: Model “chatgpt-4o-latest”, prompt includes placeholders for week number, entry count, date range, and AI Task Extractor output  
    - Credentials: OpenAI API key  
    - Input: AI Task Extractor output and weekly metadata  
    - Output: HTML email content as string  
    - Edge cases: API errors, formatting issues, missing placeholders, prompt injection risks

#### 2.5 Archiving Tasks in Google Docs

- **Overview:**  
  Appends the AI-extracted task summary to the original Google Document to keep a centralized task repository.

- **Nodes Involved:**  
  - Tasks ins Doc speichern (Save Tasks to Doc)

- **Node Details:**

  - **Tasks ins Doc speichern**  
    - Type: Google Docs  
    - Role: Updates the specified Google Document by inserting the AI Task Extractor text at the end  
    - Configuration: Operation “update”, inserts formatted text with separators and week metadata  
    - Credentials: Google Docs OAuth2  
    - Input: AI E-Mail Summary output (for coordinated timing)  
    - Output: Updated Google Doc confirmation  
    - Edge cases: Permission errors, document locked, OAuth expiry, update conflicts

#### 2.6 Notifications & Email Dispatch

- **Overview:**  
  After updating the document, sends a Telegram notification and emails the weekly summary to Julian Reich.

- **Nodes Involved:**  
  - Telegram Notification  
  - Send a message (Gmail email send)

- **Node Details:**

  - **Telegram Notification**  
    - Type: Telegram  
    - Role: Notifies user that weekly review completed successfully, includes stats  
    - Configuration: Chat ID set, message dynamically includes week number and entry count from “Weekly Filter”  
    - Credentials: Telegram API token  
    - Input: Output from “Tasks ins Doc speichern”  
    - Output: Telegram message sent confirmation  
    - Edge cases: Network issues, invalid chat ID, Telegram API limits

  - **Send a message**  
    - Type: Gmail  
    - Role: Sends the weekly summary email to Julian Reich using Gmail OAuth2  
    - Configuration: Recipient fixed email, subject includes week number, message body is HTML from “AI E-Mail Summary”  
    - Credentials: Gmail OAuth2 credentials  
    - Input: Telegram Notification output (sequenced after notification)  
    - Output: Email sent confirmation  
    - Edge cases: OAuth token expiry, SMTP errors, invalid recipient address, email formatting issues

#### 2.7 Error Handling

- **Overview:**  
  Listens for any errors during workflow execution and sends a Telegram alert if any step fails.

- **Nodes Involved:**  
  - Error Trigger  
  - Send a text message (Telegram)

- **Node Details:**

  - **Error Trigger**  
    - Type: Error Trigger  
    - Role: Captures any unhandled node execution errors in the workflow  
    - Configuration: Default, no parameters  
    - Input: System error events  
    - Output: Triggers “Send a text message” node  
    - Edge cases: Rarely fails unless workflow engine has issues

  - **Send a text message**  
    - Type: Telegram  
    - Role: Sends a Telegram alert text “Weekly review hat nicht funktioniert” to user on error  
    - Configuration: Fixed chat ID, static message  
    - Credentials: Telegram API token  
    - Input: Error Trigger output  
    - Output: Confirmation of sent alert message  
    - Edge cases: Network issues, invalid chat ID, API limits

---

### 3. Summary Table

| Node Name               | Node Type                         | Functional Role                         | Input Node(s)            | Output Node(s)           | Sticky Note                                                                                   |
|-------------------------|----------------------------------|---------------------------------------|--------------------------|--------------------------|-----------------------------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger                  | Initiates workflow weekly at 23:00   |                          | Get a document           |                                                                                               |
| Get a document          | Google Docs                      | Retrieves Google Doc content           | Schedule Trigger          | Weekly Filter            |                                                                                               |
| Weekly Filter           | Function                         | Parses and filters last 7 days entries | Get a document            | AI Task Extractor        |                                                                                               |
| AI Task Extractor       | OpenAI (LangChain)               | Extracts structured tasks & insights  | Weekly Filter             | AI E-Mail Summary        |                                                                                               |
| AI E-Mail Summary       | OpenAI (LangChain)               | Generates weekly summary email in HTML | AI Task Extractor         | Tasks ins Doc speichern  |                                                                                               |
| Tasks ins Doc speichern | Google Docs                      | Appends task summary to Google Doc    | AI E-Mail Summary         | Telegram Notification    |                                                                                               |
| Telegram Notification   | Telegram                        | Sends completion notification         | Tasks ins Doc speichern   | Send a message           |                                                                                               |
| Send a message          | Gmail                           | Sends weekly summary email             | Telegram Notification     |                          |                                                                                               |
| Error Trigger           | Error Trigger                   | Captures workflow errors               |                          | Send a text message      |                                                                                               |
| Send a text message     | Telegram                        | Sends error alert via Telegram         | Error Trigger             |                          |                                                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set to trigger every 1 week at hour 23 (11 PM)  

2. **Add Google Docs node ("Get a document"):**  
   - Operation: Get  
   - Document URL: `https://docs.google.com/document/d/1XYhGMHOPCMdZJgOyhIa77_LpUmVceyp-HjpyEj6fv48/edit?tab=t.0`  
   - Connect input from Schedule Trigger  
   - Configure Google Docs OAuth2 credentials  

3. **Add a Function node ("Weekly Filter"):**  
   - Copy and paste the custom JavaScript code which:  
     - Extracts entries with date stamps matching `📅 DD.MM.YYYY, HH:MM` from document text  
     - Filters entries from last 7 days  
     - Sorts entries chronologically  
     - Computes calendar week number  
     - Outputs combined weekly text, entry count, week number, date range, and entries array  
   - Connect input from “Get a document” node  

4. **Add OpenAI node ("AI Task Extractor"):**  
   - Model: chatgpt-4o-latest  
   - Prompt: Provide the structured instruction in German including placeholders for entry count, date range, and weekly text from “Weekly Filter”  
   - Credentials: OpenAI API key  
   - Connect input from “Weekly Filter” node  

5. **Add OpenAI node ("AI E-Mail Summary"):**  
   - Model: chatgpt-4o-latest  
   - Prompt: Compose a professional, personal HTML email summary including placeholders for week number, current date, entry count, date range, and AI Task Extractor output  
   - Credentials: OpenAI API key  
   - Connect input from “AI Task Extractor” node  

6. **Add Google Docs node ("Tasks ins Doc speichern"):**  
   - Operation: Update  
   - Document URL: same as in step 2  
   - Action: Insert text combining separators, week number, date, and AI Task Extractor output content  
   - Credentials: Google Docs OAuth2  
   - Connect input from “AI E-Mail Summary” node  

7. **Add Telegram node ("Telegram Notification"):**  
   - Message: Include week number and entry count from “Weekly Filter” for completion notice  
   - Chat ID: set to user’s Telegram chat ID  
   - Credentials: Telegram API token  
   - Connect input from “Tasks ins Doc speichern” node  

8. **Add Gmail node ("Send a message"):**  
   - Recipient: julian.reich@somedia.ch  
   - Subject: Include week number dynamically  
   - Message body: HTML content from “AI E-Mail Summary” node  
   - Credentials: Gmail OAuth2  
   - Connect input from “Telegram Notification” node  

9. **Add Error Trigger node:**  
   - Default configuration (no parameters)  

10. **Add Telegram node ("Send a text message"):**  
    - Message: Static “Weekly review hat nicht funktioniert” text  
    - Chat ID: user’s Telegram chat ID  
    - Credentials: Telegram API token  
    - Connect input from “Error Trigger” node  

11. **Validate connections:**  
    - Schedule Trigger → Get a document → Weekly Filter → AI Task Extractor → AI E-Mail Summary → Tasks ins Doc speichern → Telegram Notification → Send a message  
    - Error Trigger → Send a text message  

12. **Activate the workflow and test with a recent Google Doc containing dated entries matching the pattern.**

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                                     |
|---------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| The workflow relies on properly formatted dated entries in the Google Doc using the pattern: 📅 DD.MM.YYYY, HH:MM | Ensure consistent formatting in notes for accurate filtering and AI analysis                                      |
| Uses OpenAI GPT-4 chat model via LangChain integration for advanced natural language understanding            | Requires valid OpenAI API key with GPT-4 access                                                                    |
| Google Docs OAuth2 credentials must have read/write permissions for the target document                       | Important for both retrieving notes and appending task summaries                                                  |
| Telegram chat ID must be set correctly for notifications and error alerts                                      | Verify chat ID to ensure message delivery                                                                          |
| Gmail OAuth2 credentials required to send weekly summary email                                                | Email is sent as HTML with dynamic subject and content based on AI output                                          |
| The workflow calculates the calendar week according to ISO standards                                          | Week number is used in email subject, document annotations, and Telegram notifications                             |
| Error handling is implemented to notify via Telegram on any workflow failure                                  | Monitor Telegram for alerts to quickly identify and fix issues                                                     |
| The workflow is designed specifically for German date formats and German prompts                             | Adapt date parsing and prompt language if deploying for other locales or languages                                 |

---

**Disclaimer:**  
The provided text and workflow description are exclusively derived from an automated n8n workflow implementation. All content complies with current content policies and contains no illegal, offensive, or protected material. All manipulated data is legal and public.