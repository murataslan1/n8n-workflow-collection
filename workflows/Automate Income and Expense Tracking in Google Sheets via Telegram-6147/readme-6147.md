Automate Income and Expense Tracking in Google Sheets via Telegram

https://n8nworkflows.xyz/workflows/automate-income-and-expense-tracking-in-google-sheets-via-telegram-6147


# Automate Income and Expense Tracking in Google Sheets via Telegram

### 1. Workflow Overview

This workflow automates income and expense tracking in Google Sheets via Telegram messages. It targets users who want to quickly log financial transactions through a conversational Telegram bot interface, streamlining data entry and approval processes.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Initial Processing**: Receives Telegram messages via webhook, detects message type, and routes accordingly.
- **1.2 User Interaction and Input Guidance**: Handles `/start` commands and message inputs, providing menu options and input format instructions.
- **1.3 Input Validation and Data Extraction**: Validates user inputs, extracts data types (income or expense), and routes to parsing.
- **1.4 Data Parsing and Storage**: Parses income or expense data from messages and saves them to Google Sheets.
- **1.5 User Notification**: Notifies users about recording status, pending approval, or approval results.
- **1.6 Expense Approval Workflow**: Manages expense approval via callback queries, updating status in Sheets and notifying users.
- **1.7 Expense Detail Viewing and Supervisor Notification**: Retrieves detailed expense data for supervisor review and sends formatted messages.
- **1.8 Input Format Assistance**: Provides detailed input format help messages for income and expense entries.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception and Initial Processing

**Overview:**  
Receives incoming Telegram messages via webhook, detects message type (text, callback query), and routes messages for further handling.

**Nodes Involved:**  
- Telegram - Incoming Webhook  
- Detect Message Type  
- Route by Input Type  

**Node Details:**  

- **Telegram - Incoming Webhook**  
  - Type: Telegram Trigger  
  - Role: Entry point; listens for messages and callbacks from Telegram bot.  
  - Configuration: Uses specific webhook ID linked to the Telegram bot credentials.  
  - Input: Incoming Telegram updates (messages, callbacks).  
  - Output: Forwarded Telegram data to next node.  
  - Failure Modes: Webhook connectivity issues, Telegram API downtime.  

- **Detect Message Type**  
  - Type: Code  
  - Role: Determines if the incoming update is a message or callback query by inspecting Telegram update structure.  
  - Configuration: Custom JavaScript code to analyze update object properties.  
  - Input: Data from Telegram webhook.  
  - Output: Tagged data indicating message type for routing.  
  - Failure Modes: Unexpected update formats or missing properties.  

- **Route by Input Type**  
  - Type: Switch  
  - Role: Routes flow based on detected type: message to "Handle /start or Message Input" or callback to "Parse Callback Response".  
  - Configuration: Switch rules based on message type tag from Detect Message Type node.  
  - Input: Tagged message type data.  
  - Output: Branches to message handling or callback handling branches.  
  - Failure Modes: Misclassification due to code errors or malformed data.  

---

#### 2.2 User Interaction and Input Guidance

**Overview:**  
Handles `/start` commands or regular message inputs. Shows menu options or proceeds to input validation.

**Nodes Involved:**  
- Handle /start or Message Input  
- Show Income/Expense Options  
- Validate Input Format  

**Node Details:**  

- **Handle /start or Message Input**  
  - Type: Switch  
  - Role: Differentiates between `/start` command and other message inputs for tailored responses.  
  - Configuration: Checks message text content.  
  - Input: Incoming message data.  
  - Output: Routes to menu display or input validation.  
  - Failure Modes: Case sensitivity or unexpected message formats.  

- **Show Income/Expense Options**  
  - Type: Telegram  
  - Role: Sends Telegram message presenting income or expense options to the user as interactive buttons.  
  - Configuration: Predefined message text and inline keyboard buttons for options.  
  - Input: Triggered by `/start` or command detection.  
  - Output: Telegram message sent to user.  
  - Failure Modes: Telegram API rate limits or invalid chat IDs.  

- **Validate Input Format**  
  - Type: Code  
  - Role: Validates user text input format against expected patterns for income or expense entries.  
  - Configuration: JavaScript code with regex or parsing logic.  
  - Input: User message text.  
  - Output: Validation result for further routing.  
  - Failure Modes: Unexpected input, regex mismatches, empty messages.  

---

#### 2.3 Input Validation and Data Extraction

**Overview:**  
Extracts the data type from validated input and routes data for parsing.

**Nodes Involved:**  
- Extract Data Type  
- Route Based on Data Type  

**Node Details:**  

- **Extract Data Type**  
  - Type: Code  
  - Role: Determines if input corresponds to income or expense data.  
  - Configuration: Parses the message to identify keywords or format that indicate data type.  
  - Input: Validated user input.  
  - Output: Data type tag for routing.  
  - Failure Modes: Ambiguous inputs or missing type info.  

- **Route Based on Data Type**  
  - Type: Switch  
  - Role: Routes data to income parsing, expense parsing, or other fallback.  
  - Configuration: Switch cases on data type variable.  
  - Input: Data type tag.  
  - Output: Branches for parsing income or expense.  
  - Failure Modes: Unknown data types or empty inputs.  

---

#### 2.4 Data Parsing and Storage

**Overview:**  
Parses income or expense details and saves them to specified Google Sheets.

**Nodes Involved:**  
- Parse Income Data  
- Save Income to Sheet  
- Parse Expense Data  
- Save Expense to Sheet  

**Node Details:**  

- **Parse Income Data**  
  - Type: Code  
  - Role: Extracts structured income data (amount, category, date, comments) from message text.  
  - Configuration: JavaScript parsing logic tailored for income format.  
  - Input: Income data message text.  
  - Output: Parsed income record object.  
  - Failure Modes: Parsing errors, missing fields, format deviations.  

- **Save Income to Sheet**  
  - Type: Google Sheets  
  - Role: Appends parsed income data as a new row in the designated income tracking sheet.  
  - Configuration: Spreadsheet ID and sheet name configured; append mode enabled.  
  - Input: Parsed income record.  
  - Output: Confirmation of row insertion.  
  - Failure Modes: Authentication errors, quota limits, sheet unavailability.  

- **Parse Expense Data**  
  - Type: Code  
  - Role: Extracts structured expense data (amount, category, date, comments) from message text.  
  - Configuration: JavaScript parsing logic tailored for expense format.  
  - Input: Expense data message text.  
  - Output: Parsed expense record object.  
  - Failure Modes: Parsing errors, missing fields, format deviations.  

- **Save Expense to Sheet**  
  - Type: Google Sheets  
  - Role: Appends parsed expense data as a new row in the expense tracking sheet.  
  - Configuration: Spreadsheet ID and sheet name configured; append mode enabled.  
  - Input: Parsed expense record.  
  - Output: Confirmation of row insertion.  
  - Failure Modes: Authentication errors, quota limits, sheet unavailability.  

---

#### 2.5 User Notification

**Overview:**  
Notifies users about successful income recording or expense pending approval.

**Nodes Involved:**  
- Notify User Income Recorded  
- Notify User Expense Pending  

**Node Details:**  

- **Notify User Income Recorded**  
  - Type: Telegram  
  - Role: Sends confirmation message to user upon successful income data recording.  
  - Configuration: Predefined success message.  
  - Input: Triggered after income save.  
  - Output: Telegram confirmation message.  
  - Failure Modes: Telegram API issues, invalid chat ID.  

- **Notify User Expense Pending**  
  - Type: Telegram  
  - Role: Sends notification that expense entry is pending supervisor approval.  
  - Configuration: Predefined pending approval message.  
  - Input: Triggered after expense save.  
  - Output: Telegram notification message.  
  - Failure Modes: Telegram API issues, invalid chat ID.  

---

#### 2.6 Expense Approval Workflow

**Overview:**  
Handles callback responses from supervisors approving or rejecting expenses, updates approval status in Google Sheets, and notifies users.

**Nodes Involved:**  
- Parse Callback Response  
- Route Based on Callback Type  
- Update Approval Status  
- Get Approved Row  
- Notify User of Approval Result  

**Node Details:**  

- **Parse Callback Response**  
  - Type: Code  
  - Role: Parses callback query data from Telegram to extract approval or rejection commands.  
  - Configuration: JavaScript code analyzing callback payload.  
  - Input: Telegram callback query data.  
  - Output: Parsed callback type and associated expense identifiers.  
  - Failure Modes: Malformed callback data, missing fields.  

- **Route Based on Callback Type**  
  - Type: Switch  
  - Role: Routes flow based on callback type: approve, reject, view details, or request input format.  
  - Configuration: Switch cases for callback commands.  
  - Input: Parsed callback data.  
  - Output: Branches to appropriate approval handling or info display nodes.  
  - Failure Modes: Unknown callback commands.  

- **Update Approval Status**  
  - Type: Google Sheets  
  - Role: Updates expense approval status in the Google Sheet row identified by callback.  
  - Configuration: Spreadsheet ID, sheet, and row identification; updates approval status column.  
  - Input: Callback approval result and expense row id.  
  - Output: Confirmation of update.  
  - Failure Modes: Sheet access errors, invalid row id.  

- **Get Approved Row**  
  - Type: Google Sheets  
  - Role: Retrieves full expense row data after approval for notification purposes.  
  - Configuration: Spreadsheet ID and row id from callback.  
  - Input: Expense row id.  
  - Output: Full expense data record.  
  - Failure Modes: Row not found, sheet access issues.  

- **Notify User of Approval Result**  
  - Type: Telegram  
  - Role: Sends Telegram message to user informing them of approval or rejection result.  
  - Configuration: Message text formatted with approval status.  
  - Input: Approved expense data.  
  - Output: Telegram notification.  
  - Failure Modes: Telegram API errors, invalid chat ID.  

---

#### 2.7 Expense Detail Viewing and Supervisor Notification

**Overview:**  
Fetches detailed expense data for supervisor review and sends formatted expense details via Telegram.

**Nodes Involved:**  
- Get Row for Detail View  
- Format Expense Detail Message  
- Send Expense Detail to Supervisor  

**Node Details:**  

- **Get Row for Detail View**  
  - Type: Google Sheets  
  - Role: Retrieves the expense row selected by supervisor for detailed view.  
  - Configuration: Spreadsheet ID and row id from callback data.  
  - Input: Expense row id.  
  - Output: Complete record data.  
  - Failure Modes: Missing or invalid row id.  

- **Format Expense Detail Message**  
  - Type: Code  
  - Role: Formats retrieved expense data into a readable message with details and approval buttons.  
  - Configuration: JavaScript formatting logic creating markdown or HTML message.  
  - Input: Expense row data.  
  - Output: Formatted message text and inline keyboard for approval actions.  
  - Failure Modes: Data formatting errors.  

- **Send Expense Detail to Supervisor**  
  - Type: Telegram  
  - Role: Sends the formatted expense detail message to the supervisor via Telegram with inline approval options.  
  - Configuration: Chat ID for supervisor, message text, inline keyboard.  
  - Input: Formatted message and keyboard.  
  - Output: Telegram message sent to supervisor.  
  - Failure Modes: Invalid supervisor chat ID, API limits.  

---

#### 2.8 Input Format Assistance

**Overview:**  
Provides users with examples and instructions on how to format income and expense entries.

**Nodes Involved:**  
- Show Income Input Format  
- Send Income Format Message  
- Show Expense Input Format  
- Send Expense Format Message  

**Node Details:**  

- **Show Income Input Format**  
  - Type: Code  
  - Role: Prepares a message describing the expected income input format.  
  - Configuration: Static message creation in code node.  
  - Input: Triggered by callback or command.  
  - Output: Message text for income format.  
  - Failure Modes: None significant.  

- **Send Income Format Message**  
  - Type: Telegram  
  - Role: Sends the income input format instructions to the user.  
  - Configuration: Uses message text from previous node.  
  - Input: Message text from Show Income Input Format.  
  - Output: Telegram message.  
  - Failure Modes: Telegram API errors.  

- **Show Expense Input Format**  
  - Type: Code  
  - Role: Prepares a message describing the expected expense input format.  
  - Configuration: Static message creation in code node.  
  - Input: Triggered by callback or command.  
  - Output: Message text for expense format.  
  - Failure Modes: None significant.  

- **Send Expense Format Message**  
  - Type: Telegram  
  - Role: Sends the expense input format instructions to the user.  
  - Configuration: Uses message text from previous node.  
  - Input: Message text from Show Expense Input Format.  
  - Output: Telegram message.  
  - Failure Modes: Telegram API errors.  

---

### 3. Summary Table

| Node Name                     | Node Type             | Functional Role                           | Input Node(s)                   | Output Node(s)               | Sticky Note                        |
|-------------------------------|-----------------------|-----------------------------------------|--------------------------------|-----------------------------|----------------------------------|
| Telegram - Incoming Webhook    | Telegram Trigger      | Entry point to receive Telegram updates | —                              | Detect Message Type          |                                  |
| Detect Message Type            | Code                  | Detects if update is message or callback| Telegram - Incoming Webhook     | Route by Input Type          |                                  |
| Route by Input Type            | Switch                | Routes messages vs callback queries     | Detect Message Type             | Handle /start or Message Input, Parse Callback Response |                                  |
| Handle /start or Message Input | Switch                | Differentiates /start and other messages| Route by Input Type             | Show Income/Expense Options, Validate Input Format |                                  |
| Show Income/Expense Options    | Telegram              | Shows menu options for income/expense   | Handle /start or Message Input  | —                           |                                  |
| Validate Input Format          | Code                  | Validates user input format              | Handle /start or Message Input  | Extract Data Type            |                                  |
| Extract Data Type              | Code                  | Extracts income or expense data type    | Validate Input Format           | Route Based on Data Type     |                                  |
| Route Based on Data Type       | Switch                | Routes to income or expense parsing     | Extract Data Type               | Parse Income Data, Parse Expense Data |                                  |
| Parse Income Data              | Code                  | Parses income details from input         | Route Based on Data Type        | Save Income to Sheet         |                                  |
| Save Income to Sheet           | Google Sheets         | Saves income data to Google Sheet       | Parse Income Data               | Notify User Income Recorded  |                                  |
| Notify User Income Recorded    | Telegram              | Confirms income data recorded            | Save Income to Sheet            | —                           |                                  |
| Parse Expense Data             | Code                  | Parses expense details from input        | Route Based on Data Type        | Save Expense to Sheet        |                                  |
| Save Expense to Sheet          | Google Sheets         | Saves expense data to Google Sheet       | Parse Expense Data              | Notify User Expense Pending  |                                  |
| Notify User Expense Pending    | Telegram              | Notifies user that expense is pending approval | Save Expense to Sheet          | Send Approval Request        |                                  |
| Send Approval Request          | Telegram              | Sends approval request to supervisor     | Notify User Expense Pending     | —                           |                                  |
| Parse Callback Response        | Code                  | Parses callback query data                | Route by Input Type             | Route Based on Callback Type |                                  |
| Route Based on Callback Type   | Switch                | Routes based on callback action           | Parse Callback Response         | Update Approval Status, Get Row for Detail View, Show Income Input Format, Show Expense Input Format |                                  |
| Update Approval Status         | Google Sheets         | Updates approval status in sheet          | Route Based on Callback Type    | Get Approved Row             |                                  |
| Get Approved Row               | Google Sheets         | Retrieves approved expense row             | Update Approval Status          | Notify User of Approval Result |                                  |
| Notify User of Approval Result | Telegram              | Notifies user of approval outcome          | Get Approved Row                | —                           |                                  |
| Get Row for Detail View        | Google Sheets         | Retrieves expense row for detail view      | Route Based on Callback Type    | Format Expense Detail Message |                                  |
| Format Expense Detail Message  | Code                  | Formats expense details for supervisor     | Get Row for Detail View         | Send Expense Detail to Supervisor |                                  |
| Send Expense Detail to Supervisor | Telegram           | Sends formatted expense detail message     | Format Expense Detail Message   | —                           |                                  |
| Show Income Input Format       | Code                  | Prepares income input format instructions  | Route Based on Callback Type    | Send Income Format Message   |                                  |
| Send Income Format Message     | Telegram              | Sends income format instructions           | Show Income Input Format        | —                           |                                  |
| Show Expense Input Format      | Code                  | Prepares expense input format instructions | Route Based on Callback Type    | Send Expense Format Message  |                                  |
| Send Expense Format Message    | Telegram              | Sends expense format instructions          | Show Expense Input Format       | —                           |                                  |
| Sticky Note                   | Sticky Note           | —                                       | —                              | —                           |                                  |
| Sticky Note1                  | Sticky Note           | —                                       | —                              | —                           |                                  |
| Sticky Note2                  | Sticky Note           | —                                       | —                              | —                           |                                  |
| Sticky Note3                  | Sticky Note           | —                                       | —                              | —                           |                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Incoming Webhook Trigger Node**  
   - Type: Telegram Trigger  
   - Configure credentials for your Telegram bot.  
   - Set up webhook ID or leave default to listen for incoming Telegram updates.  

2. **Add Code Node "Detect Message Type"**  
   - Configure JavaScript code to inspect incoming updates and determine whether the update is a message or a callback query.  
   - Connect Telegram Trigger output to this node.  

3. **Add Switch Node "Route by Input Type"**  
   - Configure to route based on the output tag from "Detect Message Type" (e.g., `message` or `callback`).  
   - Connect "Detect Message Type" output to this node.  

4. **Add Switch Node "Handle /start or Message Input"**  
   - Connect "Route by Input Type" node's message branch here.  
   - Configure to detect if message text is `/start` or other.  

5. **Add Telegram Node "Show Income/Expense Options"**  
   - Send message with inline keyboard buttons to choose income or expense.  
   - Connect `/start` branch from previous node here.  
   - Configure chat ID and message text/options.  

6. **Add Code Node "Validate Input Format"**  
   - Add regex or parsing logic to validate user input message format for income or expense.  
   - Connect other message branch from "Handle /start or Message Input" here.  

7. **Add Code Node "Extract Data Type"**  
   - Parse validated message to identify if it's income or expense data.  
   - Connect from "Validate Input Format".  

8. **Add Switch Node "Route Based on Data Type"**  
   - Route based on data type extracted (income or expense).  
   - Connect from "Extract Data Type".  

9. **Add Code Node "Parse Income Data"**  
   - Extract structured income details from text.  
   - Connect income branch from switch here.  

10. **Add Google Sheets Node "Save Income to Sheet"**  
    - Configure with your Google Sheets credentials.  
    - Select spreadsheet and sheet for income data.  
    - Append parsed income data as new row.  
    - Connect from "Parse Income Data".  

11. **Add Telegram Node "Notify User Income Recorded"**  
    - Send confirmation message for income recorded.  
    - Connect from "Save Income to Sheet".  

12. **Add Code Node "Parse Expense Data"**  
    - Extract structured expense details from text.  
    - Connect expense branch from switch here.  

13. **Add Google Sheets Node "Save Expense to Sheet"**  
    - Configure with your Google Sheets credentials.  
    - Select spreadsheet and sheet for expense data.  
    - Append parsed expense data as new row.  
    - Connect from "Parse Expense Data".  

14. **Add Telegram Node "Notify User Expense Pending"**  
    - Notify user that expense requires approval.  
    - Connect from "Save Expense to Sheet".  

15. **Add Telegram Node "Send Approval Request"**  
    - Send approval request message to supervisor with inline buttons.  
    - Connect from "Notify User Expense Pending".  

16. **Add Code Node "Parse Callback Response"**  
    - Parses callback query data from Telegram approval buttons.  
    - Connect callback branch from "Route by Input Type" here.  

17. **Add Switch Node "Route Based on Callback Type"**  
    - Route callback actions: approve, reject, view details, or help commands.  
    - Connect from "Parse Callback Response".  

18. **Add Google Sheets Node "Update Approval Status"**  
    - Update approval status column in expense sheet.  
    - Connect approval/rejection branches from switch here.  

19. **Add Google Sheets Node "Get Approved Row"**  
    - Retrieve full row of the approved/rejected expense for notification.  
    - Connect from "Update Approval Status".  

20. **Add Telegram Node "Notify User of Approval Result"**  
    - Notify user about approval or rejection decision.  
    - Connect from "Get Approved Row".  

21. **Add Google Sheets Node "Get Row for Detail View"**  
    - Retrieve expense row details for supervisor review.  
    - Connect corresponding callback branch from switch here.  

22. **Add Code Node "Format Expense Detail Message"**  
    - Format retrieved expense data with approval buttons for supervisor.  
    - Connect from "Get Row for Detail View".  

23. **Add Telegram Node "Send Expense Detail to Supervisor"**  
    - Send formatted expense details to supervisor.  
    - Connect from "Format Expense Detail Message".  

24. **Add Code Nodes "Show Income Input Format" and "Show Expense Input Format"**  
    - Prepare instructional messages on input format.  
    - Connect respective callback branches from "Route Based on Callback Type".  

25. **Add Telegram Nodes "Send Income Format Message" and "Send Expense Format Message"**  
    - Send formatted input instructions to user.  
    - Connect from respective code nodes.  

26. **Configure all Telegram nodes with correct credentials and chat IDs** for users and supervisors.  
27. **Configure Google Sheets nodes** with appropriate credentials, correct spreadsheet IDs, and sheet names.  
28. **Test each branch thoroughly** to ensure all edge cases and error conditions are handled gracefully.

---

### 5. General Notes & Resources

| Note Content                                                                                                                             | Context or Link                                                |
|------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| Workflow enables streamlined financial tracking with transparent approval workflows via Telegram and Google Sheets integration.         | General overview                                              |
| Telegram bots require setting up BotFather for API tokens and webhook configuration.                                                     | Telegram Bot API documentation: https://core.telegram.org/bots/api |
| Google Sheets API credentials must have write access to the specific spreadsheet used for income and expense data storage.               | Google Sheets API docs: https://developers.google.com/sheets/api |
| Approval workflow uses Telegram callback queries with inline buttons for supervisor interactivity.                                       | Telegram callback queries: https://core.telegram.org/bots/api#callbackquery |
| Consider rate limits and error handling for Telegram and Google APIs to maintain reliability.                                            | Best practices for API usage                                   |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.