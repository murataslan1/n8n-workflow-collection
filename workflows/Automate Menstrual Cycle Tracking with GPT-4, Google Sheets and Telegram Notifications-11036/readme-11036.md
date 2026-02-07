Automate Menstrual Cycle Tracking with GPT-4, Google Sheets and Telegram Notifications

https://n8nworkflows.xyz/workflows/automate-menstrual-cycle-tracking-with-gpt-4--google-sheets-and-telegram-notifications-11036


# Automate Menstrual Cycle Tracking with GPT-4, Google Sheets and Telegram Notifications

### 1. Workflow Overview

This workflow automates menstrual cycle tracking by integrating Google Sheets for data storage, OpenAI GPT-4 for AI-driven health insights, Telegram for daily notifications, Google Calendar for reminders, and Gmail for weekly email reports. It is designed to help women and healthcare providers monitor menstrual cycles with personalized AI analysis and multi-channel communication.

The workflow is logically divided into the following blocks:

- **1.1 Daily Trigger & Configuration**: Initiates the workflow every morning at 8 AM and sets up necessary configuration parameters such as Google Sheets IDs, Telegram chat ID, email, and calendar ID.

- **1.2 Data Collection**: Retrieves period data and symptom logs from Google Sheets.

- **1.3 AI Analysis**: Sends the collected data to OpenAI GPT-4 to analyze menstrual cycle patterns, symptom correlations, predictions, and personalized recommendations.

- **1.4 Smart Routing Decision**: Determines whether the current day is a weekend or a weekday to route the workflow accordingly.

- **1.5 Weekday Branch**: Sends daily AI insights via Telegram and creates Google Calendar reminders for upcoming cycle phases.

- **1.6 Weekend Branch**: Generates a comprehensive weekly report using GPT-4 and sends it via Gmail email.

---

### 2. Block-by-Block Analysis

#### 2.1 Daily Trigger & Configuration

- **Overview**: This block triggers the workflow daily at 8 AM and establishes key configuration variables used throughout the workflow.

- **Nodes Involved**:  
  - Daily Morning Trigger  
  - Configuration Settings

- **Node Details**:

  1. **Daily Morning Trigger**  
     - Type: Schedule Trigger  
     - Role: Fires the workflow every day at 8:00 AM local time.  
     - Configuration: Set to trigger at hour 8. Timezone considerations can be adjusted in n8n settings.  
     - Inputs: None (start node)  
     - Outputs: Configuration Settings node  
     - Edge cases: If n8n server time and user timezone differ, notifications may appear at unexpected local times.

  2. **Configuration Settings**  
     - Type: Set  
     - Role: Defines static configuration parameters such as Google Sheets document ID, sheet names, Telegram chat ID, user email, and calendar ID.  
     - Configuration: Hardcoded string values placeholders that must be replaced by user-specific IDs and credentials.  
     - Key variables set:  
       - sheetsDocumentId (Google Sheets document ID)  
       - periodSheetName (sheet for period data)  
       - symptomSheetName (sheet for symptom logs)  
       - telegramChatId (Telegram user or group chat ID)  
       - userEmail (recipient email for weekly reports)  
       - calendarId (Google Calendar ID, typically 'primary')  
     - Input: Daily Morning Trigger output  
     - Output: Get Period Data node  
     - Edge cases: Failure or misconfiguration in these values stops data retrieval and subsequent steps.

---

#### 2.2 Data Collection

- **Overview**: Retrieves menstrual period data and symptom logs from Google Sheets to provide input data for AI analysis.

- **Nodes Involved**:  
  - Get Period Data  
  - Get Symptom Logs

- **Node Details**:

  1. **Get Period Data**  
     - Type: Google Sheets  
     - Role: Fetches all rows from the sheet named in `periodSheetName` within the Google Sheets document identified by `sheetsDocumentId`.  
     - Configuration: Uses dynamic expressions referencing Configuration Settings for document ID and sheet name.  
     - Input: Configuration Settings output  
     - Output: Get Symptom Logs node  
     - Edge cases: API rate limits, invalid sheet names, permission errors, empty sheets.

  2. **Get Symptom Logs**  
     - Type: Google Sheets  
     - Role: Fetches symptom log data similarly from the sheet named in `symptomSheetName`.  
     - Configuration: Dynamic expressions for document ID and sheet name.  
     - Input: Get Period Data output  
     - Output: Analyze Cycle with AI node  
     - Edge cases: Similar to Get Period Data.

---

#### 2.3 AI Analysis

- **Overview**: Uses OpenAI GPT-4 to analyze the combined period and symptom data, generating personalized health insights, cycle predictions, and recommendations.

- **Nodes Involved**:  
  - Analyze Cycle with AI

- **Node Details**:

  1. **Analyze Cycle with AI**  
     - Type: OpenAI (LangChain node)  
     - Role: Sends collected data to GPT-4 model for analysis.  
     - Configuration:  
       - Model: GPT-4  
       - Max tokens: 1500  
       - Temperature: 0.3 (low randomness for consistent results)  
     - Input: Data from Get Symptom Logs (merged period and symptom data)  
     - Output: Weekend Check node  
     - Important expressions: None explicitly shown; data passed directly for AI processing.  
     - Edge cases: API quota exceeded, network timeouts, malformed input data causing model errors.

---

#### 2.4 Smart Routing Decision

- **Overview**: Determines if the current day is a weekend (Saturday or Sunday) to route workflow to either weekend or weekday logic branches.

- **Nodes Involved**:  
  - Weekend Check (If node)

- **Node Details**:

  1. **Weekend Check**  
     - Type: If  
     - Role: Evaluates if the current day is Saturday or Sunday to choose the workflow branch.  
     - Configuration:  
       - Expression: `={{ ['Saturday', 'Sunday'].includes(new Date().toLocaleDateString('en-US', { weekday: 'long' })) }}`  
       - If true (weekend), route to Generate Weekly Report  
       - If false (weekday), route to Send Telegram Update  
     - Input: Analyze Cycle with AI output  
     - Outputs:  
       - True: Generate Weekly Report  
       - False: Send Telegram Update  
     - Edge cases: Timezone issues could misclassify day; system clock errors.

---

#### 2.5 Weekday Branch

- **Overview**: Sends daily cycle intelligence updates to Telegram and creates Google Calendar reminders for upcoming cycle phases one week ahead.

- **Nodes Involved**:  
  - Send Telegram Update  
  - Create Calendar Reminder

- **Node Details**:

  1. **Send Telegram Update**  
     - Type: Telegram  
     - Role: Sends a formatted message with daily AI-generated insights to configured Telegram chat.  
     - Configuration:  
       - Chat ID: from Configuration Settings  
       - Message text: Markdown formatted, includes AI output from "Analyze Cycle with AI" node  
       - Parse mode: Markdown for rich text formatting  
     - Input: Weekend Check false branch  
     - Output: Create Calendar Reminder node  
     - Edge cases: Telegram bot token invalid or revoked, chat ID incorrect, message formatting errors.

  2. **Create Calendar Reminder**  
     - Type: Google Calendar  
     - Role: Creates a calendar event for cycle phase reminders 7 days in the future.  
     - Configuration:  
       - Calendar: from Configuration Settings  
       - Start: 7 days from now  
       - End: 7 days + 1 hour from now  
       - Summary: "📅 Cycle Intelligence: Phase Reminder"  
       - Description: AI-generated insights from "Analyze Cycle with AI" output  
     - Input: Send Telegram Update output  
     - Output: None (end of weekday branch)  
     - Edge cases: Google Calendar API permissions, invalid calendar ID, event creation failures.

---

#### 2.6 Weekend Branch

- **Overview**: Generates a detailed weekly report using GPT-4 and emails it to the user.

- **Nodes Involved**:  
  - Generate Weekly Report  
  - Email Weekly Summary

- **Node Details**:

  1. **Generate Weekly Report**  
     - Type: OpenAI (LangChain node)  
     - Role: Creates a comprehensive 7-day summary, symptom trend analysis, predictions, and lifestyle tips.  
     - Configuration:  
       - Model: GPT-4  
       - Max tokens: 2000 (larger for detailed report)  
       - Temperature: 0.4 (slightly more creative)  
     - Input: Weekend Check true branch (from AI analysis)  
     - Output: Email Weekly Summary node  
     - Edge cases: API limits, prompt failures, timeouts.

  2. **Email Weekly Summary**  
     - Type: Gmail  
     - Role: Sends the generated weekly report to the configured user email address.  
     - Configuration:  
       - Recipient: userEmail from Configuration Settings  
       - Subject: includes current date formatted as "MMMM dd, yyyy"  
       - Message body: AI-generated report content  
     - Input: Generate Weekly Report output  
     - Output: None (end of weekend branch)  
     - Edge cases: Gmail API authentication issues, email delivery failures.

---

### 3. Summary Table

| Node Name               | Node Type                 | Functional Role                               | Input Node(s)             | Output Node(s)            | Sticky Note                                 |
|-------------------------|---------------------------|-----------------------------------------------|---------------------------|---------------------------|---------------------------------------------|
| Sticky Note - Overview  | Sticky Note               | Workflow description and high-level overview  | -                         | -                         | Contains entire workflow overview and setup instructions |
| Sticky Note 1           | Sticky Note               | Notes on the Daily Trigger node                | -                         | -                         | Explains scheduling and timezone considerations |
| Sticky Note 2           | Sticky Note               | Configuration parameters description           | -                         | -                         | Details on required IDs and settings         |
| Sticky Note 3           | Sticky Note               | Google Sheets data structure explanation       | -                         | -                         | Describes expected sheet columns             |
| Sticky Note 4           | Sticky Note               | AI analysis explanation                         | -                         | -                         | Describes AI's analysis scope and GPT-4 usage |
| Sticky Note 5           | Sticky Note               | Smart routing logic explanation                 | -                         | -                         | Explains weekday vs weekend branches          |
| Sticky Note 6           | Sticky Note               | Weekend branch details                           | -                         | -                         | Weekly email report contents                   |
| Sticky Note 7           | Sticky Note               | Weekday branch details                           | -                         | -                         | Daily Telegram updates and calendar reminders |
| Daily Morning Trigger   | Schedule Trigger           | Initiates workflow daily at 8 AM                | -                         | Configuration Settings     | See Sticky Note 1                             |
| Configuration Settings  | Set                        | Sets config variables for IDs and credentials  | Daily Morning Trigger     | Get Period Data            | See Sticky Note 2                             |
| Get Period Data         | Google Sheets              | Retrieves period tracking data                   | Configuration Settings    | Get Symptom Logs           | See Sticky Note 3                             |
| Get Symptom Logs        | Google Sheets              | Retrieves symptom logs                           | Get Period Data           | Analyze Cycle with AI      | See Sticky Note 3                             |
| Analyze Cycle with AI   | OpenAI (LangChain)         | Analyzes cycle and symptom data with GPT-4      | Get Symptom Logs          | Weekend Check              | See Sticky Note 4                             |
| Weekend Check           | If                         | Routes workflow based on weekend or weekday     | Analyze Cycle with AI     | Generate Weekly Report (T), Send Telegram Update (F) | See Sticky Note 5                             |
| Generate Weekly Report  | OpenAI (LangChain)         | Creates weekly cycle report                       | Weekend Check (T)         | Email Weekly Summary       | See Sticky Note 6                             |
| Email Weekly Summary    | Gmail                      | Sends weekly report email                         | Generate Weekly Report    | -                         | See Sticky Note 6                             |
| Send Telegram Update    | Telegram                   | Sends daily AI insights via Telegram             | Weekend Check (F)         | Create Calendar Reminder   | See Sticky Note 7                             |
| Create Calendar Reminder| Google Calendar            | Creates calendar event reminders                  | Send Telegram Update      | -                         | See Sticky Note 7                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 8:00 AM (adjust hour as needed)  
   - Connect output to next node.

2. **Create a Set node for Configuration Settings**  
   - Add string fields and assign:  
     - `sheetsDocumentId` = "YOUR_GOOGLE_SHEETS_DOCUMENT_ID"  
     - `periodSheetName` = "Period Data" (adjust to your sheet name)  
     - `symptomSheetName` = "Symptom Logs" (adjust accordingly)  
     - `telegramChatId` = "YOUR_TELEGRAM_CHAT_ID"  
     - `userEmail` = "your.email@example.com"  
     - `calendarId` = "primary" (or your calendar ID)  
   - Connect Schedule Trigger output to this node.

3. **Create a Google Sheets node: Get Period Data**  
   - Set Document ID to `={{ $json.sheetsDocumentId }}` referencing Configuration Settings  
   - Set Sheet Name to `={{ $json.periodSheetName }}`  
   - Retrieve all rows (default)  
   - Connect Configuration Settings output to this node.

4. **Create a Google Sheets node: Get Symptom Logs**  
   - Similar setup: Document ID and Sheet Name referencing Configuration Settings  
   - Connect Get Period Data output to this node.

5. **Create OpenAI node (LangChain): Analyze Cycle with AI**  
   - Use GPT-4 model  
   - Set max tokens to 1500, temperature to 0.3  
   - Input: Use output from Get Symptom Logs (period + symptom data)  
   - Connect Get Symptom Logs output to this node.

6. **Create an If node: Weekend Check**  
   - Condition: Expression `={{ ['Saturday', 'Sunday'].includes(new Date().toLocaleDateString('en-US', { weekday: 'long' })) }}`  
   - True branch: weekend  
   - False branch: weekday  
   - Connect Analyze Cycle with AI output to this If node.

7. **Weekend branch:**  
   - Create OpenAI node: Generate Weekly Report  
     - GPT-4 model, max tokens 2000, temperature 0.4  
     - Input: If node true output  
   - Create Gmail node: Email Weekly Summary  
     - Recipient: `={{ $json.userEmail }}`  
     - Subject: `"📊 Your Weekly Cycle Intelligence Report - {{$now.format('MMMM dd, yyyy')}}"`  
     - Message: AI generated content from Generate Weekly Report  
   - Connect Generate Weekly Report output to Email Weekly Summary.

8. **Weekday branch:**  
   - Create Telegram node: Send Telegram Update  
     - Chat ID: `={{ $json.telegramChatId }}`  
     - Message text: Markdown formatted with AI output from Analyze Cycle with AI node  
     - Enable Markdown parse mode  
   - Create Google Calendar node: Create Calendar Reminder  
     - Calendar ID: `={{ $json.calendarId }}`  
     - Start: `={{ $now.plus(7, 'days').toISO() }}`  
     - End: `={{ $now.plus(7, 'days').plus(1, 'hour').toISO() }}`  
     - Summary: "📅 Cycle Intelligence: Phase Reminder"  
     - Description: AI output from Analyze Cycle with AI  
   - Connect If node false output to Send Telegram Update, then to Create Calendar Reminder.

9. **Credentials Setup:**  
   - Google Sheets: Connect your Google account with read access to relevant sheets.  
   - OpenAI: Add credentials with your OpenAI API key.  
   - Telegram: Add bot token credentials; ensure bot is added to chat/group and chat ID is correct.  
   - Google Calendar: Connect Google account with calendar write permissions.  
   - Gmail: Connect Google account with email send permissions.

10. **Activate workflow:**  
    - Test trigger manually or wait for scheduled time.  
    - Verify data retrieval, AI responses, notifications, events, and emails.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                    | Context or Link                                                                                          |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| This workflow uses GPT-4 for best accuracy in health insights. Lower GPT models may reduce quality.                                                                                              | Sticky Note 4                                                                                           |
| Telegram bot setup requires obtaining a bot token via BotFather and retrieving your chat ID.                                                                                                   | Sticky Note 2, Sticky Note 7                                                                            |
| Google Sheets structure must include columns as specified to ensure correct data extraction (e.g., Start Date, End Date, Flow Level for periods; Date, Symptoms, Energy Level for symptoms).       | Sticky Note 3                                                                                           |
| Weekend reports provide detailed summaries and lifestyle tips, useful for health monitoring and planning.                                                                                        | Sticky Note 6                                                                                           |
| The workflow can be extended with additional notification channels like Slack or Discord by replicating the notification nodes and adjusting routing logic.                                     | Sticky Note - Overview                                                                                   |
| Adjust the schedule trigger time according to user preferences and timezone to ensure timely notifications.                                                                                    | Sticky Note 1                                                                                           |
| For more detailed customization, modify AI prompts inside the OpenAI nodes or add additional data sources for richer insights.                                                                  | Sticky Note - Overview                                                                                   |
| Project credits and community examples for menstrual health tracking with AI can be found on various n8n community forums and blog posts.                                                        | No specific URL in workflow; recommended user exploration on https://community.n8n.io/ and https://n8n.io/blog |

---

**Disclaimer:** The provided text is extracted exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.