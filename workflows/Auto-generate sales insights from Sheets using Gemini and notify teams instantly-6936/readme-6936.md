Auto-generate sales insights from Sheets using Gemini and notify teams instantly

https://n8nworkflows.xyz/workflows/auto-generate-sales-insights-from-sheets-using-gemini-and-notify-teams-instantly-6936


# Auto-generate sales insights from Sheets using Gemini and notify teams instantly

---

### 1. Workflow Overview

This workflow automates the collection, analysis, and dissemination of daily sales performance metrics from Google Sheets using advanced AI summarization and classification powered by Google Gemini (PaLM) models. It targets sales and business intelligence teams who need rapid, insightful updates on key business indicators such as leads, calls, revenue, and deals.

The workflow is logically divided into these functional blocks:

- **1.1 Input Reception**: Captures incoming sales metrics data via webhook and appends it to a Google Sheet.
- **1.2 Data Aggregation & Preparation**: Retrieves all sales data rows from the sheet and concatenates them into a structured format suitable for AI processing.
- **1.3 AI Processing and Insight Generation**: Uses Google Gemini chat model to generate a concise HTML-formatted summary comparing recent data trends.
- **1.4 Data Cleaning and Classification**: Removes HTML tags from AI output, classifies the insights into predefined categories (Good, Bad, Very Bad), and triggers notifications accordingly.
- **1.5 Notification and Action Automation**: Sends email reports, Telegram notifications, creates Trello backlog cards, and schedules Google Calendar meetings based on the classified insights.
- **1.6 Documentation and Comments**: Sticky Notes provide contextual information and guidance embedded within the workflow.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception

**Overview:**  
Receives daily business metrics via a webhook POST request and appends this data as a new row in a Google Sheet.

**Nodes Involved:**  
- Webhook  
- Save to Sheet

**Node Details:**  

- **Webhook**  
  - Type: Webhook  
  - Role: Entry point accepting POST requests with daily metrics data.  
  - Configuration: HTTP POST method, fixed unique path for external triggers.  
  - Key Variables: Incoming JSON body with fields `date`, `newLeads`, `callsMade`, `revenue`, `dealsClosed`, `demosBooked`.  
  - Input: External HTTP POST request.  
  - Output: JSON payload forwarded downstream.  
  - Edge cases: Invalid/malformed JSON, missing required fields, unauthorized access (if webhook is public).  
  - Version: 2  

- **Save to Sheet**  
  - Type: Google Sheets node  
  - Role: Appends the received metrics as a new row in a designated Google Sheet.  
  - Configuration: Mapping each field from webhook JSON body explicitly to corresponding sheet columns (Date, New Leads, Calls Made, Demos Booked, Deals Closed, Revenue ($)). Append operation, no type conversion.  
  - Credentials: Google Sheets OAuth2 required.  
  - Input: Data from Webhook node.  
  - Output: Confirmation and metadata of append operation.  
  - Edge cases: Sheet access errors, invalid documentId/sheetName, API quota limits, data type mismatches.  
  - Version: 4.6  

---

#### 2.2 Data Aggregation & Preparation

**Overview:**  
Retrieves all rows from the Google Sheet and concatenates relevant sales data into structured text blocks to facilitate AI summarization.

**Nodes Involved:**  
- Get All Rows  
- Concat Sales Data  
- Sticky Note1 (commentary)

**Node Details:**  

- **Get All Rows**  
  - Type: Google Sheets node  
  - Role: Reads all rows from the configured Google Sheet containing accumulated sales data.  
  - Configuration: Reads entire sheet without filters or sorting.  
  - Credentials: Google Sheets OAuth2.  
  - Input: Triggered after Save to Sheet node completes.  
  - Output: Array of rows with columns: Date, New Leads, Calls Made, Demos Booked, Deals Closed, Revenue ($).  
  - Edge cases: Empty sheet, read failures, API limits.  
  - Version: 4.6  

- **Concat Sales Data**  
  - Type: Code (JavaScript) node  
  - Role: Transforms array of rows into an array of formatted strings describing each metric per date to help the AI model parse and analyze data easily.  
  - Configuration: Iterates all input items, creates strings like `Date: ...`, `New Leads: ...`, etc., returns JSON object containing last date from webhook and concatenated data array.  
  - Key Expressions: Uses `$input.all()` to process all data, references Webhook node to extract last date.  
  - Input: Output from Get All Rows.  
  - Output: JSON object with `lastDate` and `data` array of formatted strings.  
  - Edge cases: Empty data input, reference to Webhook node failing if Webhook data missing.  
  - Version: 2  

- **Sticky Note1**  
  - Content: Explains that this block concatenates data into one string to facilitate AI insight generation.

---

#### 2.3 AI Processing and Insight Generation

**Overview:**  
Generates a concise summary of the sales metrics comparing recent days and formats output as HTML (body only), leveraging Google Gemini chat model and chain summarization.

**Nodes Involved:**  
- Google Gemini Chat Model  
- Generate Insights  
- Sticky Note (overview)

**Node Details:**  

- **Google Gemini Chat Model**  
  - Type: Google Gemini (PaLM) chat model node  
  - Role: Provides AI language model capability to process text inputs for summarization and classification.  
  - Configuration: Uses "models/gemini-2.5-pro".  
  - Credentials: Google PaLM API account.  
  - Input: Receives prompts and text via LangChain nodes.  
  - Output: AI-generated text output.  
  - Edge cases: API quota limits, network errors, model response latency.  
  - Version: 1  

- **Generate Insights**  
  - Type: LangChain summarization chain node  
  - Role: Uses a custom prompt to summarize daily business metrics data, comparing latest data with previous 3 days and generating HTML-formatted summary text (body only, no tags).  
  - Configuration:  
    - Summarization method: custom prompt with placeholders for `{text}`.  
    - Output: HTML format summary containing percentage changes separated by columns.  
    - Chunk size large enough to handle all data.  
  - Input: Concatenated sales data from previous block.  
  - Output: Summarized insight text.  
  - Edge cases: Empty or malformed input text, prompt failures, incomplete data causing inaccurate summaries.  
  - Version: 2.1  

- **Sticky Note**  
  - Content: Describes the overall workflow purpose to automate daily sales metrics collection, AI summarization, and automatic email reporting.

---

#### 2.4 Data Cleaning and Classification

**Overview:**  
Removes HTML tags from AI-generated summary, classifies the cleaned insight text into predefined sentiment categories, and branches workflow for notification and action.

**Nodes Involved:**  
- Remove HTML Tags  
- Classify Insight

**Node Details:**  

- **Remove HTML Tags**  
  - Type: LangChain chain LLM node  
  - Role: Cleans the AI summary text by stripping HTML tags and formatting it for Telegram message compatibility.  
  - Configuration: Custom prompt instructing to clean text and output in Telegram-friendly format without explanations.  
  - Input: Output text from Generate Insights.  
  - Output: Clean plain text version of the insights.  
  - Edge cases: Improperly formatted input, prompt processing errors.  
  - Version: 1.7  

- **Classify Insight**  
  - Type: LangChain text classifier node  
  - Role: Categorizes cleaned insight text into "Good", "Bad", or "Very Bad" based on revenue and deal trends.  
  - Configuration:  
    - System prompt defines categories and expectations explicitly, instructing to output only the category name without explanation or HTML tags.  
    - Input text bound to cleaned text from previous node.  
  - Input: Cleaned insight text.  
  - Output: Classification result text.  
  - Edge cases: Ambiguous or borderline text causing incorrect classification, prompt failures.  
  - Version: 1.1  

---

#### 2.5 Notification and Action Automation

**Overview:**  
Depending on classification, sends notifications to email and Telegram groups, creates Trello backlog cards, and schedules Google Calendar meetings for follow-up actions.

**Nodes Involved:**  
- Send a message  
- Notify Group  
- Create a backlog  
- Create a meeting  
- Sticky Note2 (commentary)

**Node Details:**  

- **Send a message**  
  - Type: Gmail node  
  - Role: Sends an email containing the HTML summary report to a designated email address.  
  - Configuration:  
    - Recipient fixed email `rully.saputra4@gmail.com`.  
    - Subject includes "Business Metrics - " plus last date from sales data.  
    - Email body contains the AI-generated HTML summary text.  
  - Credentials: Gmail OAuth2.  
  - Input: Output from Generate Insights.  
  - Output: Email send confirmation.  
  - Edge cases: SMTP errors, invalid credentials, network issues.  
  - Version: 2.1  

- **Notify Group**  
  - Type: Telegram node  
  - Role: Sends a Telegram message to a specified group chat with the cleaned insight text and timestamp.  
  - Configuration:  
    - Chat ID set to group channel.  
    - Message includes workflow name, current timestamp, and classified performance text.  
  - Credentials: Telegram API.  
  - Input: Classification node output (text).  
  - Output: Send confirmation.  
  - Edge cases: Chat ID errors, Telegram API limits, connectivity.  
  - Version: 1.2  

- **Create a backlog**  
  - Type: Trello node  
  - Role: Creates a Trello card in a specific list to track action items based on the insight classification.  
  - Configuration:  
    - Card name includes workflow name and current timestamp.  
    - Description contains classified insight text.  
    - Assigned to specific member ID.  
  - Credentials: Trello API.  
  - Input: Classification node output.  
  - Output: Card creation confirmation.  
  - Edge cases: Trello API limits, invalid list or member IDs, permission issues.  
  - Version: 1  

- **Create a meeting**  
  - Type: Google Calendar node  
  - Role: Schedules a calendar event 24 hours in the future to discuss critical business metrics flagged as "Very Bad".  
  - Configuration:  
    - Start and end times relative to current time (+24h to +25h).  
    - Attendees include fixed email.  
    - Event description contains link to Trello backlog card.  
  - Credentials: Google Calendar OAuth2.  
  - Input: Output from Create a backlog node.  
  - Output: Event creation confirmation.  
  - Edge cases: Calendar API errors, invalid attendee emails, scheduling conflicts.  
  - Version: 1.3  

- **Sticky Note2**  
  - Content: Highlights the creation of immediate action plans including backlog card, event, and stakeholder invitations.

---

#### 2.6 Documentation and Comments

**Overview:**  
Sticky Notes provide documentation and context for users and maintainers within the workflow editor.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1  
- Sticky Note2

**Node Details:**  

- These nodes do not process data but contain markdown-formatted explanations and instructions relevant to adjacent logical blocks.

---

### 3. Summary Table

| Node Name             | Node Type                                  | Functional Role                       | Input Node(s)        | Output Node(s)                        | Sticky Note                                                                                          |
|-----------------------|--------------------------------------------|------------------------------------|----------------------|-------------------------------------|----------------------------------------------------------------------------------------------------|
| Webhook               | Webhook                                    | Receive daily sales metrics         | External HTTP POST    | Save to Sheet                       |                                                                                                    |
| Save to Sheet         | Google Sheets                              | Append daily metrics to sheet       | Webhook              | Get All Rows                       |                                                                                                    |
| Get All Rows          | Google Sheets                              | Retrieve all sales data             | Save to Sheet        | Concat Sales Data                  |                                                                                                    |
| Concat Sales Data     | Code (JavaScript)                          | Format data for AI processing       | Get All Rows          | Generate Insights                  | ## Processing Data Concating data into one string to helping the model generate insights easier    |
| Google Gemini Chat Model | LangChain Google Gemini Chat Model       | AI model for summarization          | (Used internally)     | Generate Insights, Classify Insight, Remove HTML Tags | ## Daily Sales Metrics Auto-Insight This workflow automates the process of collecting daily sales metrics from Google Sheets, summarize the insights using Google Gemini model, and sends a concise report to email automatically. |
| Generate Insights     | LangChain chainSummarization               | Summarize sales data with AI        | Concat Sales Data     | Send a message, Remove HTML Tags   |                                                                                                    |
| Send a message        | Gmail                                      | Email summary report                | Generate Insights     |                                     |                                                                                                    |
| Remove HTML Tags      | LangChain chainLlm                         | Clean HTML tags from summary text   | Generate Insights     | Classify Insight                  |                                                                                                    |
| Classify Insight      | LangChain textClassifier                    | Categorize insight sentiment        | Remove HTML Tags      | Notify Group, Create a backlog    |                                                                                                    |
| Notify Group          | Telegram                                   | Send Telegram notification          | Classify Insight      |                                     |                                                                                                    |
| Create a backlog      | Trello                                     | Create Trello card for actions      | Classify Insight      | Create a meeting                  | ## Creating immediate action Create a card backlog, attach to the event description and invite the stakeholders |
| Create a meeting      | Google Calendar                            | Schedule meeting for follow-up      | Create a backlog      |                                     |                                                                                                    |
| Sticky Note           | Sticky Note                               | Documentation                      |                      |                                     | ## Daily Sales Metrics Auto-Insight This workflow automates the process of collecting daily sales metrics from Google Sheets, summarize the insights using Google Gemini model, and sends a concise report to email automatically. |
| Sticky Note1          | Sticky Note                               | Documentation                      |                      |                                     | ## Processing Data Concating data into one string to helping the model generate insights easier      |
| Sticky Note2          | Sticky Note                               | Documentation                      |                      |                                     | ## Creating immediate action Create a card backlog, attach to the event description and invite the stakeholders |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook node**  
   - Type: Webhook  
   - Set HTTP Method to POST  
   - Define a unique path (e.g., `5e2d95f2-a6c7-4ae0-b3bd-c10bde013de9`)  
   - No authentication by default (consider securing externally)  

2. **Create a Google Sheets node ("Save to Sheet")**  
   - Operation: Append  
   - Set Document ID & Sheet Name for the sales metrics sheet  
   - Map incoming JSON fields from webhook:  
     - Date → Date  
     - New Leads → New Leads  
     - Calls Made → Calls Made  
     - Demos Booked → Demos Booked  
     - Deals Closed → Deals Closed  
     - Revenue ($) → Revenue ($)  
   - Use Google Sheets OAuth2 credentials  

3. **Connect Webhook → Save to Sheet**

4. **Create a Google Sheets node ("Get All Rows")**  
   - Operation: Read all rows  
   - Use same Document ID & Sheet Name as above  
   - Use Google Sheets OAuth2 credentials  

5. **Connect Save to Sheet → Get All Rows**

6. **Create a Code node ("Concat Sales Data")**  
   - Paste the provided JavaScript code to format sales data into string array with keys and values, capturing last date from Webhook node.  
   - Input: All rows from Get All Rows node  

7. **Connect Get All Rows → Concat Sales Data**

8. **Add LangChain Google Gemini Chat Model node**  
   - Configure to use `models/gemini-2.5-pro`  
   - Connect downstream LangChain nodes to this AI node for processing  
   - Use Google PaLM API credentials  

9. **Create LangChain Summarization Chain node ("Generate Insights")**  
   - Set summarization prompt to instruct concise summary with comparisons across last 3 days, output HTML body only (no surrounding tags), with percentage changes, formatted as per example.  
   - Chunk size large enough to include all data  
   - Connect input from Concat Sales Data  
   - Connect AI model node as languageModel  

10. **Connect Concat Sales Data → Generate Insights and AI model node**

11. **Create Gmail node ("Send a message")**  
    - Recipient: `rully.saputra4@gmail.com`  
    - Subject: `Business Metrics - {{ last date from sales data }}`  
    - Body: Include `Daily Report Summary` and insert generated HTML summary  
    - Use Gmail OAuth2 credentials  

12. **Connect Generate Insights → Send a message**

13. **Create LangChain Chain LLM node ("Remove HTML Tags")**  
    - Prompt: Clean input text from HTML tags, output Telegram format, no explanation.  
    - Input: Output text from Generate Insights  

14. **Connect Generate Insights → Remove HTML Tags**

15. **Create LangChain Text Classifier node ("Classify Insight")**  
    - Define categories: Good, Bad, Very Bad with detailed descriptions related to revenue and deals trend.  
    - Input text: Cleaned text from Remove HTML Tags  
    - System prompt: Instruct output to be category only, no explanation or tags.  

16. **Connect Remove HTML Tags → Classify Insight**

17. **Create Telegram node ("Notify Group")**  
    - Chat ID: `-4869385284` (Telegram Group)  
    - Message: Include workflow name, timestamp, and classified insight text  
    - Use Telegram API credentials  

18. **Connect Classify Insight → Notify Group**

19. **Create Trello node ("Create a backlog")**  
    - List ID: `66266d87882b20a8324063bc`  
    - Card Name: Include workflow name and current timestamp  
    - Description: Classified insight text  
    - Assign to Member ID: `5b90fe107e11f13a69d74fde`  
    - Use Trello API credentials  

20. **Connect Classify Insight → Create a backlog**

21. **Create Google Calendar node ("Create a meeting")**  
    - Calendar: Select appropriate Google Calendar account  
    - Start: Now plus 24 hours  
    - End: Now plus 25 hours  
    - Summary: "Business Daily Metrics - {{ today }}"  
    - Description: Include Trello backlog card URL  
    - Attendees: `rully.saputra4@gmail.com`  
    - Allow guests to invite others  
    - Use Google Calendar OAuth2 credentials  

22. **Connect Create a backlog → Create a meeting**

23. **Add Sticky Notes**  
    - Add descriptive Sticky Notes in relevant positions:  
      - Workflow overview and purpose near entry nodes  
      - Data processing explanation near Concat Sales Data  
      - Immediate action explanation near backlog and meeting nodes  

24. **Activate the workflow** and test by POSTing sample daily sales metrics JSON to the webhook URL.

---

### 5. General Notes & Resources

| Note Content                                                                                                    | Context or Link                                                                                          |
|----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| This workflow uses Google Gemini (PaLM) models integrated via LangChain nodes for advanced AI summarization.    | Google Gemini Chat Model node configuration and usage.                                                  |
| Ensure Google Sheets document and sheet names are correctly set and accessible by the configured OAuth2 account. | Credential and document setup critical for data reading/writing.                                        |
| Telegram Group Chat ID and Trello List ID must be validated for permissions and proper notification routing.    | Telegram Bot API and Trello API configurations.                                                         |
| Gmail OAuth2 and Google Calendar OAuth2 credentials require appropriate scopes for sending emails and scheduling events. | Credential setup must include Gmail and Calendar API scopes.                                            |
| The workflow expects timely and correctly formatted webhook data to maintain data integrity.                    | Input JSON must include fields: date, newLeads, callsMade, revenue, dealsClosed, demosBooked.            |
| The classification categories and thresholds can be customized in the Classify Insight node prompt.            | Modify categories in LangChain textClassifier node for business-specific thresholds.                     |
| For security, consider adding authentication or validation layers on the Webhook node since it is publicly exposed. | Protect workflow from unauthorized access or spam.                                                      |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---